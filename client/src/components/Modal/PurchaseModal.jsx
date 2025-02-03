/* eslint-disable react/prop-types */
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import { Fragment, useState } from 'react'
import useAuth from '../../hooks/useAuth';
import Button from '../Shared/Button/Button';
import toast from 'react-hot-toast'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PurchaseModal = ({ closeModal, isOpen, plant, refetch }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalQuantity, setTotalQuantity] = useState(1)
  const { category, seller, quantity, name, price, _id } = plant;
  const [totalPrice, setTotalPrice] = useState(price);
  const [purchaseInfo, setPurchaseInfo] = useState({
    customer: {
      name: user?.displayName,
      email: user?.email,
      image: user?.photoURL
    },
    plantId: _id,
    price: totalPrice,
    quantity: totalQuantity,
    seller: seller?.email,
    address: '',
    status: 'Pending'
  })




  // handle Quantity function
  const handleQuantity = (value) => {

    if (value > quantity) {
      return toast.error('Exceeds Available Quantity!')
    }
    if (value < 1) {
      return toast.error('Need to add one or more')
    }
    setTotalQuantity(value)
    setTotalPrice(value * price)
    setPurchaseInfo(prv => {
      return { ...prv, quantity: value, price: value * quantity }
    })

  }

  // Handle Purchase
  const handlePurchase = async () => {
    console.log(purchaseInfo)
    try{
      await axios.post(`${import.meta.env.VITE_API_URL}/orders`, purchaseInfo)
      await axios.patch(`${import.meta.env.VITE_API_URL}/plant/quantity/${_id}`,{
        quantityToUpdate: totalQuantity,

      })
      toast.success('Order successfull!');
      refetch();
      navigate('/dashboard/my-orders')
    }
    catch(err){
      console.log(err)
    }
    finally{
      closeModal()
    }
  }

  // Total Price Calculation

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-25' />
        </TransitionChild>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <TransitionChild
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <DialogPanel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
                <DialogTitle
                  as='h3'
                  className='text-lg font-medium text-center leading-6 text-gray-900'
                >
                  Review Info Before Purchase
                </DialogTitle>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Plant: {name}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Category: {category}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Customer: {user?.displayName}</p>
                </div>

                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Price: $ {price}</p>
                </div>
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>Available Quantity: {quantity}</p>
                </div>
                {/* quantity section */}
                <div className='space-y-1 flex gap-2 items-center text-sm pr-6'>
                  <label htmlFor='quantity' className='block text-gray-600'>
                    Quantity
                  </label>
                  <input
                    className='px-4 py-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white'
                    name='quantity'
                    value={totalQuantity}
                    onChange={(e) => handleQuantity(parseInt(e.target.value))}
                    id='quantity'
                    type='number'
                    placeholder='Quantity'
                    required
                  />
                </div>
                <div className='space-y-1 flex gap-2 items-center text-sm pr-6'>
                  <label htmlFor='address' className='block text-gray-600'>
                    Address
                  </label>
                  <input
                    className='px-4 py-3 text-gray-800 border border-lime-300 focus:outline-lime-500 rounded-md bg-white'
                    name='address'
                    id='address'
                    onChange={(e) => setPurchaseInfo(prv => {
                      return { ...prv, address: e.target.value }
                    })}
                    type='text'
                    placeholder='Shipping Address'
                    required
                  />
                </div>
                <div className='mt-6 flex gap-6 justify-between'>
                  <Button onClick={closeModal} label={'Cancel'}></Button>
                  <Button onClick={handlePurchase} label={`Pay: ${totalPrice}$`}></Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default PurchaseModal
