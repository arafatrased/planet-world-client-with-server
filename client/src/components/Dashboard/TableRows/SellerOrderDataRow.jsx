/* eslint-disable react/prop-types */
import PropTypes from 'prop-types'
import { useState } from 'react'
import DeleteModal from '../../Modal/DeleteModal'
import useAxiosSecure from '../../../hooks/useAxiosSecure'
import toast from 'react-hot-toast'
const SellerOrderDataRow = ({orderData, refetch}) => {
  const axiosSecure = useAxiosSecure();
  const {name, price, customer, address, quantity, _id, status, plantId} = orderData || {}

  let [isOpen, setIsOpen] = useState(false)
  const closeModal = () => setIsOpen(false)
  //handle Order delete/Cancel

  const handleDelete = async() =>{

    try{
      //fetchind deleting data
      await axiosSecure.delete(`${import.meta.env.VITE_API_URL}/orders/${_id}`)
      // increase quantity from plant collection
      await axiosSecure.patch(`${import.meta.env.VITE_API_URL}/plant/quantity/${plantId}`,{
        quantityToUpdate: quantity,
        status: 'increase',
      })
      toast.success('Order Cancelled!!')
      refetch()
    }
    catch(err){
      console.log(err)
    }
    finally{
      closeModal();
    }

  }

  const handleStatus = async(newStatus) =>{
    if(status === newStatus) return
    // update/patch status
    try{
      // update order status
      await axiosSecure.patch(`/orders/${_id}`,{
        status: newStatus,
      })
      toast.success('Status Updated')
      refetch()
    }
    catch(err){
      console.log(err)
    }
    finally{
      closeModal();
    }
    
  }

  return (
    <tr>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{name}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{customer?.email}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>${price}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{quantity}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{address}</p>
      </td>
      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <p className='text-gray-900 whitespace-no-wrap'>{status}</p>
      </td>

      <td className='px-5 py-5 border-b border-gray-200 bg-white text-sm'>
        <div className='flex items-center gap-2'>
          <select
            required
            disabled={status === 'Delivered'}
            defaultValue={status}
            onChange={(e) => handleStatus(e.target.value)}
            className='p-1 border-2 border-lime-300 focus:outline-lime-500 rounded-md text-gray-900 whitespace-no-wrap bg-white'
            name='category'
          >
            <option value='Pending'>Pending</option>
            <option value='In Progress'>Start Processing</option>
            <option value='Delivered'>Delivered</option>
          </select>
          <button
            onClick={() => setIsOpen(true)}
            disabled={status === "Delivered"}
            className='relative disabled:cursor-not-allowed cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight'
          >
            <span
              aria-hidden='true'
              className='absolute inset-0 bg-red-200 opacity-50 rounded-full'
            ></span>
            <span className='relative'>Cancel</span>
          </button>
        </div>
        <DeleteModal handleDelete={handleDelete} isOpen={isOpen} closeModal={closeModal} />
      </td>
    </tr>
  )
}

SellerOrderDataRow.propTypes = {
  order: PropTypes.object,
  refetch: PropTypes.func,
}

export default SellerOrderDataRow
